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

    public List<LocationDTO> getLocations(Long familyId, User user) {
        validateFamilyAccess(familyId, user);
        List<Location> locations = locationRepository.findByFamilyId(familyId);
        return locations.stream().map(LocationDTO::fromEntity).collect(Collectors.toList());
    }

    public List<LocationDTO> getRootLocations(Long familyId, User user) {
        validateFamilyAccess(familyId, user);
        List<Location> locations = locationRepository.findByFamilyIdAndParentIdIsNull(familyId);
        return locations.stream().map(LocationDTO::fromEntity).collect(Collectors.toList());
    }

    public List<LocationDTO> getChildLocations(Long familyId, Long parentId, User user) {
        validateFamilyAccess(familyId, user);
        List<Location> locations = locationRepository.findByFamilyIdAndParentId(familyId, parentId);
        return locations.stream().map(LocationDTO::fromEntity).collect(Collectors.toList());
    }

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
