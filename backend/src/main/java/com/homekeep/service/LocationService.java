package com.homekeep.service;

import com.homekeep.dto.CreateLocationRequest;
import com.homekeep.dto.LocationDTO;
import com.homekeep.entity.FamilyMember;
import com.homekeep.entity.Location;
import com.homekeep.entity.User;
import com.homekeep.exception.BusinessException;
import com.homekeep.repository.FamilyMemberRepository;
import com.homekeep.repository.LocationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LocationService {

    private final LocationRepository locationRepository;
    private final FamilyMemberRepository familyMemberRepository;

    /**
     * 校验用户是否为家庭成员
     * @param familyId 家庭ID
     * @param user 当前用户
     * @throws BusinessException 用户不是家庭成员时抛出异常
     */
    public void validateFamilyAccess(Long familyId, User user) {
        if (!familyMemberRepository.existsByFamilyIdAndUserId(familyId, user.getId())) {
            throw new BusinessException("您不是该家庭的成员");
        }
    }

    /**
     * 创建新位置
     * @param familyId 家庭ID
     * @param user 当前用户
     * @param request 创建请求，包含位置名称和父级位置ID
     * @return 创建成功的位置信息，自动构建位置路径
     */
    @Transactional
    public LocationDTO createLocation(Long familyId, User user, CreateLocationRequest request) {
        validateFamilyAccess(familyId, user);

        Location location = new Location();
        location.setFamilyId(familyId);
        location.setName(request.getName());
        location.setParentId(request.getParentId());

        if (request.getParentId() != null) {
            Location parent = locationRepository.findById(request.getParentId())
                    .orElseThrow(() -> new BusinessException("父级位置不存在"));
            location.setPath(parent.getPath() + " / " + parent.getName());
        } else {
            location.setPath("");
        }

        location = locationRepository.save(location);

        if (location.getPath() == null || location.getPath().isEmpty()) {
            location.setPath(location.getName());
        } else {
            location.setPath(location.getPath() + " / " + location.getName());
        }
        location = locationRepository.save(location);

        return LocationDTO.fromEntity(location);
    }

    /**
     * 获取家庭的所有位置列表
     * @param familyId 家庭ID
     * @param user 当前用户
     * @return 位置列表
     */
    public List<LocationDTO> getLocations(Long familyId, User user) {
        validateFamilyAccess(familyId, user);
        List<Location> locations = locationRepository.findByFamilyId(familyId);
        return locations.stream().map(LocationDTO::fromEntity).collect(Collectors.toList());
    }

    /**
     * 获取家庭的一级位置列表（无父级位置）
     * @param familyId 家庭ID
     * @param user 当前用户
     * @return 顶级位置列表
     */
    public List<LocationDTO> getRootLocations(Long familyId, User user) {
        validateFamilyAccess(familyId, user);
        List<Location> locations = locationRepository.findByFamilyIdAndParentIdIsNull(familyId);
        return locations.stream().map(LocationDTO::fromEntity).collect(Collectors.toList());
    }

    /**
     * 获取指定位置的子位置列表
     * @param familyId 家庭ID
     * @param parentId 父级位置ID
     * @param user 当前用户
     * @return 子位置列表
     */
    public List<LocationDTO> getChildLocations(Long familyId, Long parentId, User user) {
        validateFamilyAccess(familyId, user);
        List<Location> locations = locationRepository.findByFamilyIdAndParentId(familyId, parentId);
        return locations.stream().map(LocationDTO::fromEntity).collect(Collectors.toList());
    }

    /**
     * 删除位置
     * @param familyId 家庭ID
     * @param locationId 位置ID
     * @param user 当前用户
     * @throws BusinessException 位置不存在或不属于该家庭时抛出异常
     */
    @Transactional
    public void deleteLocation(Long familyId, Long locationId, User user) {
        validateFamilyAccess(familyId, user);
        Location location = locationRepository.findById(locationId)
                .orElseThrow(() -> new BusinessException("位置不存在"));
        if (!location.getFamilyId().equals(familyId)) {
            throw new BusinessException("位置不存在");
        }
        locationRepository.delete(location);
    }
}
