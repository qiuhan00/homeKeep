package com.homekeep.service;

import com.homekeep.dto.CreateLocationRequest;
import com.homekeep.dto.LocationDTO;
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

    public void validateFamilyAccess(Long familyId, User user) {
        if (!familyMemberRepository.existsByFamilyIdAndUserId(familyId, user.getId())) {
            throw new BusinessException("您不是该家庭的成员");
        }
    }

    @Transactional
    public LocationDTO createLocation(Long familyId, User user, CreateLocationRequest request) {
        validateFamilyAccess(familyId, user);

        Location location = new Location();
        location.setFamilyId(familyId);
        location.setName(request.getName());
        location.setParentId(request.getParentId());
        location.setIsSystem(false);  // 用户创建的都是家庭私有位置

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

    // 获取系统默认位置 + 家庭私有位置
    public List<LocationDTO> getLocations(Long familyId, User user) {
        validateFamilyAccess(familyId, user);
        List<Location> locations = locationRepository.findAllWithSystem(familyId);
        return locations.stream().map(LocationDTO::fromEntity).collect(Collectors.toList());
    }

    // 获取根位置：系统根位置 + 家庭私有根位置
    public List<LocationDTO> getRootLocations(Long familyId, User user) {
        validateFamilyAccess(familyId, user);
        List<Location> locations = locationRepository.findRootLocations(familyId);
        return locations.stream().map(LocationDTO::fromEntity).collect(Collectors.toList());
    }

    // 获取子位置
    public List<LocationDTO> getChildLocations(Long familyId, Long parentId, User user) {
        validateFamilyAccess(familyId, user);
        // 子位置只从家庭私有位置获取
        List<Location> locations = locationRepository.findByFamilyIdAndParentIdOrderByNameAsc(familyId, parentId);
        return locations.stream().map(LocationDTO::fromEntity).collect(Collectors.toList());
    }

    @Transactional
    public void deleteLocation(Long familyId, Long locationId, User user) {
        validateFamilyAccess(familyId, user);
        Location location = locationRepository.findById(locationId)
                .orElseThrow(() -> new BusinessException("位置不存在"));
        // 只能删除家庭私有位置，不能删除系统默认位置
        if (location.getFamilyId() == null || !location.getFamilyId().equals(familyId)) {
            throw new BusinessException("无法删除系统默认位置");
        }
        locationRepository.delete(location);
    }
}
